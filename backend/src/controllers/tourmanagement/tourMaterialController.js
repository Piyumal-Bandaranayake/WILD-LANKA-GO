const TourMaterial = require("../../models/tourmanagement/tourMaterial");

// Create new material (upload)
const uploadMaterial = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    const uploadedBy = req.user?._id; // Get user ID from auth middleware

    if (!title || !uploadedBy) {
      return res.status(400).json({ message: "Please provide title and ensure you are logged in" });
    }

    // Handle file upload
    let fileUrl = '';
    let fileType = type || 'other';
    
    if (req.file) {
      fileUrl = `/uploads/tour-materials/${req.file.filename}`;
      // Determine file type from uploaded file
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
        fileType = 'image';
      } else if (['pdf'].includes(fileExtension)) {
        fileType = 'pdf';
      } else if (['doc', 'docx'].includes(fileExtension)) {
        fileType = 'doc';
      } else if (['mp3', 'wav'].includes(fileExtension)) {
        fileType = 'audio';
      } else if (['mp4', 'avi'].includes(fileExtension)) {
        fileType = 'video';
      }
    } else {
      return res.status(400).json({ message: "Please upload a file" });
    }

    const material = new TourMaterial({
      tourId: null, // Can be associated with a tour later
      uploadedBy,
      title,
      description: description || '',
      fileUrl,
      fileType
    });

    await material.save();
    res.status(201).json({ message: "Tour material uploaded successfully", material });
  } catch (error) {
    res.status(500).json({ message: "Error uploading material", error: error.message });
  }
};

// Get all materials
const getAllMaterials = async (req, res) => {
  try {
    const materials = await TourMaterial.find().populate("tourId").populate("uploadedBy");
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: "Error fetching materials", error: error.message });
  }
};

// Get material by ID
const getMaterialById = async (req, res) => {
  try {
    const material = await TourMaterial.findById(req.params.id).populate("tourId").populate("uploadedBy");
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }
    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ message: "Error fetching material", error: error.message });
  }
};

// Get materials for a specific tour
const getMaterialsByTour = async (req, res) => {
  try {
    const materials = await TourMaterial.find({ tourId: req.params.tourId }).populate("uploadedBy");
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tour materials", error: error.message });
  }
};

// Delete a material
const deleteMaterial = async (req, res) => {
  try {
    const material = await TourMaterial.findByIdAndDelete(req.params.id);
    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }
    res.status(200).json({ message: "Material deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting material", error: error.message });
  }
};

module.exports = {
  uploadMaterial,
  getAllMaterials,
  getMaterialById,
  getMaterialsByTour,
  deleteMaterial
};
