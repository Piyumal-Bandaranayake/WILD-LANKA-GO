import TourMaterial from "../../models/tourmanagement/tourMaterial.js";

// Create new material (upload)
export const uploadMaterial = async (req, res) => {
  try {
    const { tourId, uploadedBy, title, description, fileUrl, fileType } = req.body;

    if (!tourId || !uploadedBy || !title || !fileUrl) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const material = new TourMaterial({
      tourId,
      uploadedBy,
      title,
      description,
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
export const getAllMaterials = async (req, res) => {
  try {
    const materials = await TourMaterial.find().populate("tourId").populate("uploadedBy");
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: "Error fetching materials", error: error.message });
  }
};

// Get material by ID
export const getMaterialById = async (req, res) => {
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
export const getMaterialsByTour = async (req, res) => {
  try {
    const materials = await TourMaterial.find({ tourId: req.params.tourId }).populate("uploadedBy");
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tour materials", error: error.message });
  }
};

// Delete a material
export const deleteMaterial = async (req, res) => {
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
