import PDFDocument from 'pdfkit';
import AnimalCase from '../../models/Animal Care Management/AnimalCase.js';
import path from 'path';
import fs from 'fs';  // To stream the file for download
import { uploadMultipleImages, deleteAnimalImage } from '../../config/cloudinary.js';

// Create a new animal case
export const createAnimalCase = async (req, res) => {
  try {
    const newCase = new AnimalCase(req.body);  // Create a new instance of AnimalCase

    // Handle image file upload if any
    if (req.files && req.files.photosDocumentation) {
      const images = req.files.photosDocumentation.map(file => file.path); // Assuming files are saved to the 'uploads' folder
      newCase.photosDocumentation = images;
    }

    await newCase.save();  // Save the new case to the database
    res.status(201).json(newCase);  // Return the created case
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create a new animal case with Cloudinary images
export const createAnimalCaseWithImages = async (req, res) => {
  try {
    const caseData = req.body;

    // Handle image upload to Cloudinary
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      try {
        // Convert files to base64 data URLs for Cloudinary
        const fileBuffers = req.files.map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
        uploadedImages = await uploadMultipleImages(fileBuffers, 'wild-lanka-go/animal-cases');
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({ message: 'Failed to upload images', error: uploadError.message });
      }
    }

    // Create new animal case with uploaded image URLs
    const newCase = new AnimalCase({
      ...caseData,
      images: uploadedImages.map(img => ({
        public_id: img.public_id,
        url: img.secure_url,
        original_filename: img.original_filename
      })),
      createdAt: new Date()
    });

    await newCase.save();
    res.status(201).json(newCase);
  } catch (error) {
    console.error('Create animal case error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update animal case with new images
export const updateAnimalCaseWithImages = async (req, res) => {
  try {
    const caseId = req.params.id;
    const updateData = req.body;

    // Find existing case
    const existingCase = await AnimalCase.findById(caseId);
    if (!existingCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Handle new image uploads
    let newImages = [];
    if (req.files && req.files.length > 0) {
      try {
        const fileBuffers = req.files.map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
        const uploadedImages = await uploadMultipleImages(fileBuffers, 'wild-lanka-go/animal-cases');
        newImages = uploadedImages.map(img => ({
          public_id: img.public_id,
          url: img.secure_url,
          original_filename: img.original_filename
        }));
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({ message: 'Failed to upload new images', error: uploadError.message });
      }
    }

    // Combine existing and new images
    const updatedImages = [...(existingCase.images || []), ...newImages];

    // Update the case
    const updatedCase = await AnimalCase.findByIdAndUpdate(
      caseId,
      {
        ...updateData,
        images: updatedImages,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json(updatedCase);
  } catch (error) {
    console.error('Update animal case error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get a specific animal case by ID
export const getAnimalCaseById = async (req, res) => {
  try {
    const animalCase = await AnimalCase.findById(req.params.id);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }
    res.json(animalCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all animal cases with optional filtering by priority or status
export const getAllAnimalCases = async (req, res) => {
  try {
    const { priority, status } = req.query;
    const filter = {};
    if (priority) filter.priority = priority;
    if (status) filter.status = status;

    const cases = await AnimalCase.find(filter);
    res.json(cases);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update the status of an animal case (e.g., assigned, in progress, completed)
export const updateAnimalCaseStatus = async (req, res) => {
  try {
    const animalCase = await AnimalCase.findById(req.params.id);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Update the status and set updatedAt to the current time
    animalCase.status = req.body.status;
    animalCase.updatedAt = Date.now();
    await animalCase.save();  // Save the updated case
    res.json(animalCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an existing animal case (animal data or photos)
export const updateAnimalCase = async (req, res) => {
  try {
    const animalCase = await AnimalCase.findById(req.params.id);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Update the fields with the new data provided in the request body
    const updatedFields = req.body;
    Object.assign(animalCase, updatedFields); // Merge the new data into the existing case

    // Handle image file upload if any
    if (req.files && req.files.photosDocumentation) {
      const images = req.files.photosDocumentation.map(file => file.path);
      animalCase.photosDocumentation.push(...images);  // Add new images to the existing list
    }

    // Save the updated case
    animalCase.updatedAt = Date.now();
    await animalCase.save();  // Save the updated case
    res.json(animalCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an animal case
export const deleteAnimalCase = async (req, res) => {
  try {
    const animalCase = await AnimalCase.findByIdAndDelete(req.params.id);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }
    res.json({ message: 'Animal case deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate a PDF report for an animal case using PDFKit
export const generateCaseReport = async (req, res) => {
  try {
    const animalCase = await AnimalCase.findById(req.params.id);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Create a new PDF document
    const doc = new PDFDocument();

    // Pipe the PDF into the response for downloading
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=case-report-${animalCase.caseId}.pdf`
    );

    doc.pipe(res);  // Direct the output to the response stream

    // Add title to the document
    doc.fontSize(20).text('Animal Case Report', { align: 'center' });

    // Add case information in a structured format
    doc.moveDown(2);
    doc.fontSize(12).text(`Case ID: ${animalCase.caseId}`);
    doc.text(`Animal Type: ${animalCase.animalType}`);
    doc.text(`Species (Scientific Name): ${animalCase.speciesScientificName}`);
    doc.text(`Age/Size: ${animalCase.ageSize}`);
    doc.text(`Gender: ${animalCase.gender}`);
    doc.text(`Priority: ${animalCase.priority}`);
    doc.text(`Location: ${animalCase.location}`);
    doc.text(`Reported By: ${animalCase.reportedBy}`);
    doc.text(`Primary Condition: ${animalCase.primaryCondition}`);
    doc.text(`Symptoms/Observations: ${animalCase.symptomsObservations}`);
    doc.text(`Initial Treatment Plan: ${animalCase.initialTreatmentPlan}`);
    doc.text(`Status: ${animalCase.status}`);
    doc.text(`Created At: ${animalCase.createdAt.toDateString()}`);
    doc.text(`Last Updated At: ${animalCase.updatedAt.toDateString()}`);

    // Check if photosDocumentation is available and add them to the PDF (if needed)
    if (animalCase.photosDocumentation && animalCase.photosDocumentation.length > 0) {
      doc.addPage();  // Add a new page for images
      animalCase.photosDocumentation.forEach((photoPath, index) => {
        const imagePath = path.join(__dirname, '..', '..', '..', photoPath);
        if (fs.existsSync(imagePath)) {
          doc.image(imagePath, { fit: [250, 300], align: 'center' });
          doc.text(`Image ${index + 1}`, { align: 'center' });
          doc.moveDown(2);
        }
      });
    }

    // End the document and send it to the user
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: error.message });
  }
};
