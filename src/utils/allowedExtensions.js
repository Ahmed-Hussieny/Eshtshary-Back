export const allowedExtensions = {
    image: ['image/jpeg','text/plain', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml'],
    video: ['video/mp4', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/quicktime', 'video/x-ms-wmv'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac'],
    document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // ✅ Fix: Support .xlsx
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/rtf'
    ],
    archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'],
};
