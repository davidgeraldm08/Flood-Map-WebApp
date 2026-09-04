require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
const pool = require("./db.js");
const multer = require('multer');
const path = require('path');
const cors = require('cors');
app.use(cors());
app.use('/uploads', express.static('uploads'));





const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'photos'){
            cb(null, 'uploads/photos');
        } else if (file.fieldname === 'video') {
            cb(null, 'uploads/videos');
        }
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
})



const fileFilter = function (req, file, cb) {
    if (file.fieldname === 'photos') {
        if(file.mimetype.startsWith('image/')) {
            cb(null,true);
        }else {
            cb(new Error('Only image files are allowed for photos'),false)
        }
    }else if (file.fieldname === 'video') {
        if(file.mimetype.startsWith('video/')){
            cb(null,true);
        }else {
            cb(new Error('Only video files are allowed for videos'),false)
        }
    }else {
        cb(new Error('Unexpected field'),false);
    }
};






const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024
    }
});






function requireAdmin(req, res, next) {
    const password = req.headers['x-admin-password'];
    if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}







app.get('/', (req, res) => {
    res.send('Hello, flood app!');
});




app.get("/api/reports", async (req, res) => {
    try {
        const reportsResult = await pool.query(
            "SELECT * FROM flood_reports WHERE status = 'approved' ORDER BY reported_at DESC"
        );

        const reports = reportsResult.rows;

        for (const report of reports) {
            const photosResult = await pool.query(
                `SELECT photo_path FROM flood_report_photos WHERE report_id = $1`,
                [report.id]
            );
            report.photos = photosResult.rows.map((row) => row.photo_path);
        }

        res.json(reports);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});





app.get('/api/reports/pending', requireAdmin, async (req, res) => {
  try {
    const reportsResult = await pool.query(
      `SELECT * FROM flood_reports WHERE status = 'pending' ORDER BY reported_at DESC`
    );

    const reports = reportsResult.rows;

    for (const report of reports) {
      const photosResult = await pool.query(
        `SELECT photo_path FROM flood_report_photos WHERE report_id = $1`,
        [report.id]
      );
      report.photos = photosResult.rows.map((row) => row.photo_path);
    }

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});





app.patch('/api/reports/:id/status',requireAdmin, async (req, res) => {
    try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE flood_reports SET status = $1 WHERE id = $2 RETURNING *`,
        [status, id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
    } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
    }
});










app.post('/api/reports', upload.fields([
    { name: 'photos' , maxCount: 20},
    { name: 'video' , MaxCount: 1},
]), async (req,res) => {
    const client = await pool.connect();
    try {

        const photos = req.files['photos'];
        const video = req.files['video'] ? req.files['video'][0]:null;


        if (!photos || photos.length === 0) {
            return res.status(400).json ({error: 'At least one photo is required'});
        }

        const {lat, lng, road_name, depth_level, passability} = req.body;
        const video_path = video ? video.path : null;

        await client.query('BEGIN');

        const reportResult = await client.query(
            `INSERT INTO flood_reports (lat, lng, road_name, depth_level, passability, video_path)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [lat, lng, road_name, depth_level, passability, video_path]
        );
        
        const reportID = reportResult.rows[0].id;

        for (const photo of photos) {
            await client.query(
                `INSERT INTO flood_report_photos (report_id, photo_path) VALUES ($1, $2)`,
                [reportID, photo.path]
            )
        }

        await client.query('COMMIT');
        res.status(201).json({message: 'Report created' , reportID});
    }catch (err) {
        await client.query('ROLLBACK')
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    } finally {
        client.release();
    }
});


app.delete('/api/reports/:id', requireAdmin, async (req, res) => {
    try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM flood_reports WHERE id = $1 RETURNING *`,
        [id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted' });
    } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
    }
});




app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');

});