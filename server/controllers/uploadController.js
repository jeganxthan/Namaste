import fs from'fs';
import path from'path';
import upload from'../middleware/uploadMiddleware.js';
import User from'../models/User.js';

const uploadImages = async (req, res) => {
    try {
        upload.fields([{ name: 'profileImage' }])(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: "File upload failed", error: err.message });
            }

            const uploadFolder = path.join(__dirname, '..', 'uploads/');
            const baseUrl = `${req.protocol}://${req.get("host")}`;
            let newProfileImage;

            if (req.files && req.files.profileImage && req.files.profileImage.length > 0) {
                newProfileImage = req.files.profileImage[0];
            }

            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (newProfileImage) {
                if (user.profileImageUrl) {
                    const oldProfile = path.join(uploadFolder, path.basename(user.profileImageUrl));
                    if (fs.existsSync(oldProfile)) {
                        fs.unlinkSync(oldProfile);
                    }
                }

                user.profileImageUrl = `${baseUrl}/uploads/${newProfileImage.filename}`;
                await user.save();
            }

            res.status(200).json({
                message: "Image uploaded successfully",
                profileImageUrl: user.profileImageUrl,
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to upload", error: error.message });
    }
};

export default uploadImages
