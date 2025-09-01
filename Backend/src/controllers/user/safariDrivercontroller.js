import SafariDriver from "../../models/User/safariDriver.js";

// ✅ Register Safari Driver
const registerSafariDriver = async (req, res) => {

    const { DriverName, Email, PhoneNumber, username, password, LicenceNumber, vechicleType, vechicleNumber, availability } = req.body;

 


  // ✅ Input validation
  if (!DriverName || !Email || !PhoneNumber || !username || !password || !LicenceNumber || !vechicleType || !vechicleNumber) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  try {
    // ✅ Check duplicates
    const existingDriver = await SafariDriver.findOne({
      $or: [
        { Email },
        { username },
        { LicenceNumber },
        { vechicleNumber }
      ]
    });


    try {
        // Check if the email, username, licence number or vehicle number is already taken
        const existingDriver = await SafariDriver.findOne({ $or: [{ Email }, { username }, { LicenceNumber }, { vechicleNumber }] });
        if (existingDriver) {
            return res.status(400).json({ message: 'Email, Username, Licence Number or Vehicle Number already exists' });
        }

        // Optional availability validation (if sent)
        const allowedAvailabilities = ['Available', 'Busy', 'OnLeave', 'Inactive'];
        let availabilityToSave = undefined;
        if (availability !== undefined) {
            if (!allowedAvailabilities.includes(availability)) {
                return res.status(400).json({ message: 'Invalid availability value' });
            }
            availabilityToSave = availability;
        }

        // Create a new safari driver
        const newSafariDriver = new SafariDriver({
            DriverName,
            Email,
            PhoneNumber,
            username,
            Password,
            LicenceNumber,
            vechicleType,
            vechicleNumber,
            ...(availabilityToSave !== undefined ? { availability: availabilityToSave } : {}) // keep your model default if not provided
        });

        // Save the safari driver to the database
        await newSafariDriver.save();
        res.status(201).json({ message: 'Safari Driver registered successfully', safariDriver: newSafariDriver });
    } catch (error) {
        res.status(500).json({ message: 'Error registering safari driver', error: error.message });


    }

    // ✅ No manual hash needed – model will hash it
    const newSafariDriver = new SafariDriver({
      DriverName,
      Email,
      PhoneNumber,
      username,
      password, // hash in schema
      LicenceNumber,
      vechicleType,
      vechicleNumber
    });

    await newSafariDriver.save();
    res.status(201).json({
      message: 'Safari Driver registered successfully',
      safariDriver: newSafariDriver
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error registering safari driver',
      error: error.message
    });
  }
};

// ✅ Get all Safari Drivers
const getSafariDrivers = async (req, res) => {
  try {
    const drivers = await SafariDriver.find();
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching safari drivers', error: error.message });
  }
};

// ✅ Get Safari Driver by ID
const getSafariDriverById = async (req, res) => {
  try {
    const driver = await SafariDriver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Safari Driver not found' });
    }
    res.status(200).json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Safari Driver', error: error.message });
  }
};


// ✅ Update ONLY availability for a driver
const updateDriverAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { availability } = req.body;

        const allowedAvailabilities = ['Available', 'Busy', 'OnLeave', 'Inactive'];
        if (!availability || !allowedAvailabilities.includes(availability)) {
            return res.status(400).json({ message: 'Invalid availability value' });
        }

        const driver = await SafariDriver.findByIdAndUpdate(
            id,
            { availability },
            { new: true }
        );

        if (!driver) {
            return res.status(404).json({ message: 'Safari Driver not found' });
        }

        res.status(200).json({ message: 'Availability updated', driver });
    } catch (error) {
        res.status(500).json({ message: 'Error updating availability', error: error.message });
    }
};

export { registerSafariDriver, getSafariDrivers, updateDriverAvailability,getSafariDriverById };



