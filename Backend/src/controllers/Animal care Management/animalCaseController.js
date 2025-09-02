import AnimalCase from '../../models/Animal Care Management/AnimalCase.js';
import path from 'path';

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