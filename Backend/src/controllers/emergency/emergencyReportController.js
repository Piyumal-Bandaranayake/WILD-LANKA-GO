import EmergencyForm from '../../models/emergency/emergencyForm.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateEmergencyReport = async (req, res) => {
    try {
        const { case_id } = req.params;

        const emergency = await EmergencyForm.findById(case_id);
        if (!emergency) {
            return res.status(404).json({ message: 'Emergency form not found' });
        }

        const reportsDirectory = path.join(__dirname, '../../reports');
        if (!fs.existsSync(reportsDirectory)) {
            fs.mkdirSync(reportsDirectory, { recursive: true }); // Add recursive option
        }

        const doc = new PDFDocument();
        const filePath = path.join(reportsDirectory, `${case_id}_emergency_form_report.pdf`);
        
        // Create write stream
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Add PDF content
        doc.fontSize(18).text('Emergency Form Report', { align: 'center' });
        doc.fontSize(12).text(`Emergency Case ID: ${emergency._id}`, { align: 'left' });
        doc.text(`Name: ${emergency.name}`);
        doc.text(`Email: ${emergency.email}`);
        doc.text(`Phone: ${emergency.phone}`);
        doc.text(`Property Name: ${emergency.property_name}`);
        doc.text(`Location: ${emergency.location}`);
        doc.text(`Emergency Type: ${emergency.emergency_type}`);
        doc.text(`Description: ${emergency.description}`);
        doc.text(`Date: ${new Date(emergency.date).toLocaleDateString()}`);
        doc.text(`Time: ${emergency.time}`);

        doc.end();

        // Wait for stream to finish before downloading
        stream.on('finish', () => {
            res.download(filePath, `${case_id}_emergency_form_report.pdf`, (err) => {
                if (err) {
                    console.error('Error downloading the report:', err);
                    return res.status(500).json({ message: 'Error downloading the report' });
                }
            });
        });

        stream.on('error', (err) => {
            console.error('Error writing PDF:', err);
            res.status(500).json({ message: 'Error generating PDF file' });
        });

    } catch (error) {
        console.error('Error generating emergency form report:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export { generateEmergencyReport };