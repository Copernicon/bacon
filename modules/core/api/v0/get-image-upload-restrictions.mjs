import server from '/core/backend/data/server.json' assert { type: 'json' };

export default () =>
{
	const extensions = Object.keys(server.uploadImgExtensions);
	return JSON.stringify({ success: true, 'max-upload-size': server.maxUploadSize, extensions });
};