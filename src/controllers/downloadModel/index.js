module.exports = {
    download: async (req, res) => {
        res.download(process.env.DOWNLOADFILE_PATH);
    }
}