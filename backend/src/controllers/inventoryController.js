const Medicine = require('../models/Medicine');
const logger = require('../../config/logger');

// Get all medicines with simple filtering
const getMedicines = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    // Build simple filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { medicineId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (status) {
      filter.status = status;
    }

    // Execute query
    const medicines = await Medicine.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    // Add stock status for each medicine
    const medicinesWithStatus = medicines.map(medicine => {
      let stockStatus = 'Normal';
      if (medicine.currentStock === 0) stockStatus = 'Out of Stock';
      else if (medicine.currentStock <= medicine.minimumStock) stockStatus = 'Low Stock';
      
      return {
        ...medicine,
        stockStatus,
        isLowStock: medicine.currentStock <= medicine.minimumStock
      };
    });

    res.json({
      success: true,
      data: medicinesWithStatus
    });
  } catch (error) {
    logger.error('Error fetching medicines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medicines',
      error: error.message
    });
  }
};

// Get single medicine by ID
const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const medicine = await Medicine.findById(id)
      .populate('createdBy', 'firstName lastName email');

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Add stock status
    let stockStatus = 'Normal';
    if (medicine.currentStock === 0) stockStatus = 'Out of Stock';
    else if (medicine.currentStock <= medicine.minimumStock) stockStatus = 'Low Stock';

    res.json({
      success: true,
      data: {
        ...medicine.toObject(),
        stockStatus,
        isLowStock: medicine.currentStock <= medicine.minimumStock
      }
    });
  } catch (error) {
    logger.error('Error fetching medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medicine',
      error: error.message
    });
  }
};

// Create new medicine
const createMedicine = async (req, res) => {
  try {
    const medicineData = {
      ...req.body,
      medicineId: Medicine.generateMedicineId(),
      createdBy: req.user.id
    };

    const newMedicine = new Medicine(medicineData);
    await newMedicine.save();

    const populatedMedicine = await Medicine.findById(newMedicine._id)
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      data: populatedMedicine
    });
  } catch (error) {
    logger.error('Error creating medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create medicine',
      error: error.message
    });
  }
};

// Update medicine
const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const medicine = await Medicine.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });
  } catch (error) {
    logger.error('Error updating medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medicine',
      error: error.message
    });
  }
};

// Delete medicine
const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    
    const medicine = await Medicine.findByIdAndDelete(id);
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete medicine',
      error: error.message
    });
  }
};

// Update stock (for adding/removing stock)
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, quantity } = req.body;

    if (!['add', 'remove', 'set'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be add, remove, or set'
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    let newStock;
    switch (action) {
      case 'add':
        newStock = medicine.currentStock + quantity;
        break;
      case 'remove':
        if (medicine.currentStock < quantity) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock to remove'
          });
        }
        newStock = medicine.currentStock - quantity;
        break;
      case 'set':
        newStock = quantity;
        break;
    }

    medicine.currentStock = newStock;
    await medicine.save();

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        medicineId: medicine.medicineId,
        newStock: medicine.currentStock,
        action,
        quantity
      }
    });
  } catch (error) {
    logger.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
};

// Get inventory dashboard stats
const getInventoryStats = async (req, res) => {
  try {
    const totalMedicines = await Medicine.countDocuments();
    const activeMedicines = await Medicine.countDocuments({ status: 'Active' });
    const outOfStock = await Medicine.countDocuments({ currentStock: 0 });
    const lowStock = await Medicine.countDocuments({ 
      $expr: { $lte: ['$currentStock', '$minimumStock'] },
      currentStock: { $gt: 0 }
    });

    res.json({
      success: true,
      data: {
        totalMedicines,
        activeMedicines,
        outOfStock,
        lowStock
      }
    });
  } catch (error) {
    logger.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory stats',
      error: error.message
    });
  }
};

module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock,
  getInventoryStats
};
