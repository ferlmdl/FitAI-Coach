import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import VideoModel from '../models/video.js'; 


export const uploadAndAnalyzeVideo = async (req, res) => {
    const { userId, title } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No se recibió ningún archivo de video.' });
    }
    if (!userId || !title) {
        return res.status(400).json({ success: false, error: 'Falta el userId o el title.' });
    }

    const videoPath = req.file.path;
    let videoRecord; 

    try {
        videoRecord = await VideoModel.createVideo({
            userId: userId,
            title: title,
            videoUrl: videoPath, // En un caso real, esto sería la URL en Supabase Storage
            status: 'processing'
        });
        
        const scriptPath = path.resolve('scripts/analyze_video.py');
        const pythonProcess = spawn('python3', [scriptPath, videoPath]);

        let result = '';
        let error = '';
        pythonProcess.stdout.on('data', (data) => result += data.toString());
        pythonProcess.stderr.on('data', (data) => error += data.toString());

        pythonProcess.on('close', async (code) => {
            fs.unlinkSync(videoPath);

            if (code !== 0) {
                await VideoModel.updateVideo(videoRecord.id, { status: 'failed' });
                return res.status(500).json({ success: false, error: error || 'Error al analizar el video' });
            }

            try {
                const analysisResult = JSON.parse(result);
                const updatedVideo = await VideoModel.updateVideo(videoRecord.id, {
                    analysis_result: analysisResult,
                    status: 'analyzed'
                });

                res.json({ success: true, analysis: updatedVideo });
            } catch (e) {
                await VideoModel.updateVideo(videoRecord.id, { status: 'failed' });
                res.status(500).json({ success: false, error: 'Error al procesar el resultado del análisis' });
            }
        });

    } catch (err) {
        if (videoPath && fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }
        res.status(500).json({ success: false, error: 'Error de servidor: ' + err.message });
    }
};

export const getUserVideos = async (req, res) => {
    const { userId } = req.params;
    try {
        const videos = await VideoModel.getVideosByUserId(userId);
        res.json({ success: true, videos });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
};

export const getVideoById = async (req, res) => {
    const { videoId } = req.params;
    try {
        const video = await VideoModel.getVideoById(videoId);
        if (!video) {
            return res.status(404).json({ success: false, error: 'Video no encontrado.' });
        }
        res.json({ success: true, video });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
};