import Medication from '../../models/Animal Care Management/Medication.js';
import nodemailer from 'nodemailer';

// Add new medication
export const addMedication = async (req, res) => {
  try {
    const { name, description, quantity, unit, expiryDate: expiryDateString, threshold, supplierEmail } = req.body;

    let expiryDate;
    if (expiryDateString) {
        expiryDate = new Date(expiryDateString);
    }
    const newMedication = new Medication({ name, description, quantity, unit, expiryDate, threshold, supplierEmail });
    await newMedication.save();
    res.status(201).json(newMedication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update medication stock after receiving new stock
export const updateMedicationStock = async (req, res) => {
  try {
    const { id, quantityReceived } = req.body;
    const medication = await Medication.findById(id);
    if (!medication) return res.status(404).json({ message: 'Medication not found' });
    
    medication.quantity += quantityReceived;
    await medication.save();
    res.json(medication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Order medication from the supplier if stock is low
export const orderMedication = async (req, res) => {
  try {
    const { id, quantityToOrder } = req.body;
    const medication = await Medication.findById(id);
    if (!medication) return res.status(404).json({ message: 'Medication not found' });

    if (medication.quantity <= medication.threshold) {
      const orderEmail = medication.supplierEmail;
      
      // Send email to the supplier
      const transporter = nodemailer.createTransport({
        service: 'gmail',

        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: orderEmail,
        subject: 'Medication Order',
        text: `We are placing an order for ${quantityToOrder} units of ${medication.name}.`
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          return res.status(500).json({ message: err.message });
        }
        res.json({ message: 'Order sent to supplier successfully', info });
      });
    } else {
      res.status(400).json({ message: 'Stock is sufficient, no need to order' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all medications
export const getAllMedications = async (req, res) => {
  try {
    const medications = await Medication.find();
    res.status(200).json(medications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get medication by ID
export const getMedicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const medication = await Medication.findById(id);
    if (!medication) {
      return res.status(404).json({ message: 'Medication not found' });
    }
    res.status(200).json(medication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update medication
export const updateMedication = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, quantity, unit, expiryDate: expiryDateString, threshold, supplierEmail } = req.body;

    let expiryDate;
    if (expiryDateString) {
        expiryDate = new Date(expiryDateString);
    }

    const updatedMedication = await Medication.findByIdAndUpdate(
      id,
      { name, description, quantity, unit, expiryDate, threshold, supplierEmail },
      { new: true }
    );

    if (!updatedMedication) {
      return res.status(404).json({ message: 'Medication not found' });
    }
    res.status(200).json(updatedMedication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete medication
export const deleteMedication = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMedication = await Medication.findByIdAndDelete(id);
    if (!deletedMedication) {
      return res.status(404).json({ message: 'Medication not found' });
    }
    res.status(200).json({ message: 'Medication deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
