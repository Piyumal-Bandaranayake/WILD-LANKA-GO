import TourGuide from "../../models/User/tourGuide.js";

// ✅ Register a new Tour Guide
const registerTourGuide = async (req, res) => {
    try {
        const {
            firstname,
            lastname,
            email,
            Username,
            password,
            phone,
            Guide_Registration_No,
            Experience_Year
        } = req.body;

        if (!firstname || !lastname || !email || !Username || !password ||
            !phone || !Guide_Registration_No || !Experience_Year) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        const existingGuide = await TourGuide.findOne({
            $or: [
                { email: email.toLowerCase() },
                { Username: Username.toLowerCase() },
                { Guide_Registration_No }
            ]
        });

        if (existingGuide) {
            if (existingGuide.email.toLowerCase() === email.toLowerCase()) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            if (existingGuide.Username.toLowerCase() === Username.toLowerCase()) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            if (existingGuide.Guide_Registration_No === Guide_Registration_No) {
                return res.status(400).json({ message: 'Guide Registration Number already exists' });
            }
        }

        const newGuide = new TourGuide({
            firstname,
            lastname,
            email: email.toLowerCase(),
            Username: Username.toLowerCase(),
            password,
            phone,
            Guide_Registration_No,
            Experience_Year,
            Status: 'Pending',
            isAvailable: false, // Default to false
            currentTourStatus: 'Idle'
        });

        await newGuide.save();

        res.status(201).json({
            message: 'Tour guide registered successfully and is pending approval',
            guide: {
                id: newGuide._id,
                firstname: newGuide.firstname,
                lastname: newGuide.lastname,
                email: newGuide.email,
                Username: newGuide.Username
            }
        });

    } catch (error) {
        console.error('❌ Error registering tour guide:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation error', errors });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ✅ Get all Tour Guides
const getTourGuides = async (req, res) => {
    try {
        const guides = await TourGuide.find();
        res.status(200).json(guides);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tour guides', error: error.message });
    }
};

// ✅ Get Tour Guide by ID
const getTourGuideById = async (req, res) => {
    try {
        const guide = await TourGuide.findById(req.params.id);
        if (!guide) {
            return res.status(404).json({ message: 'Tour Guide not found' });
        }
        res.status(200).json(guide);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tour guide', error: error.message });
    }
};

// ✅ Toggle Availability (Simple boolean toggle like Wildlife Officer)
const updateGuideAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        
        const guide = await TourGuide.findById(id);
        if (!guide) {
            return res.status(404).json({ message: 'Tour Guide not found' });
        }
        
        // Toggle availability (true/false)
        const updatedGuide = await TourGuide.findByIdAndUpdate(
            id,
            { isAvailable: !guide.isAvailable },
            { new: true }
        );
        
        res.status(200).json({ 
            message: `Tour Guide is now ${updatedGuide.isAvailable ? 'available' : 'unavailable'}`,
            guide: updatedGuide 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling availability', error: error.message });
    }
};

// ✅ Update current tour status field
const updateGuideCurrentTourStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentTourStatus } = req.body;

        const allowed = ['Idle', 'Processing', 'Started', 'Ended'];
        if (!currentTourStatus || !allowed.includes(currentTourStatus)) {
            return res.status(400).json({ message: 'Invalid currentTourStatus value' });
        }

        const guide = await TourGuide.findByIdAndUpdate(
            id,
            { currentTourStatus },
            { new: true }
        );

        if (!guide) return res.status(404).json({ message: 'Tour Guide not found' });

        res.status(200).json({ message: 'Current tour status updated', guide });
    } catch (error) {
        res.status(500).json({ message: 'Error updating current tour status', error: error.message });
    }
};

// ✅ Update Guide Status (Approve/Reject) - Set availability to true when approved
const updateGuideStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { Status } = req.body;

        const allowedStatuses = ['Pending', 'Approved', 'Rejected'];
        if (!Status || !allowedStatuses.includes(Status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const guide = await TourGuide.findById(id);
        if (!guide) {
            return res.status(404).json({ message: 'Tour Guide not found' });
        }

        const updatedGuide = await TourGuide.findByIdAndUpdate(
            id,
            { 
                Status,
                // If approved, set availability to true
                ...(Status === 'Approved' && { isAvailable: true })
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({ 
            message: `Guide status updated to ${Status}`, 
            guide: updatedGuide 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating guide status', error: error.message });
    }
};

// ✅ Get Available Tour Guides
const getAvailableGuides = async (req, res) => {
    try {
        const availableGuides = await TourGuide.find({ 
            isAvailable: true,
            Status: 'Approved' 
        });
        res.status(200).json(availableGuides);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching available tour guides', error: error.message });
    }
};

const updateTourGuide = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;       
        // Prevent updating to existing email, username, or registration number

        if (updates.email || updates.Username || updates.Guide_Registration_No) {
            const existingGuide = await TourGuide.findOne({
                $or: [
                    { email: updates.email ? updates.email.toLowerCase() : null },
                    { Username: updates.Username ? updates.Username.toLowerCase() : null },
                    { Guide_Registration_No: updates.Guide_Registration_No || null }
                ],
                _id: { $ne: id } // Exclude current guide
            });
            if (existingGuide) {
                if (existingGuide.email === updates.email) {
                    return res.status(400).json({ message: 'Email already exists' });
                }
                if (existingGuide.Username === updates.Username) {
                    return res.status(400).json({ message: 'Username already exists' });
                }
                if (existingGuide.Guide_Registration_No === updates.Guide_Registration_No) {
                    return res.status(400).json({ message: 'Guide Registration Number already exists' });
                }
            }
            if (updates.email) updates.email = updates.email.toLowerCase();
            if (updates.Username) updates.Username = updates.Username.toLowerCase();
        }

        const updatedGuide = await TourGuide.findByIdAnd
        Update
        (id, updates, { new: true, runValidators: true });
        if (!updatedGuide) {
            return res.status(404).json({ message: 'Tour Guide not found' });
        }
        res.status(200).json({ message: 'Tour Guide profile updated', guide: updatedGuide });
    }
    catch (error) {
        console.error('❌ Error updating tour guide profile:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation error', errors });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

export { 
    registerTourGuide, 
    getTourGuides, 
    getTourGuideById,
    updateGuideStatus,
    updateGuideAvailability, 
    updateGuideCurrentTourStatus,
    getAvailableGuides,
    updateTourGuide,
};