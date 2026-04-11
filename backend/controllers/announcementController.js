import Announcement from '../models/Announcement.js';

export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(25);

    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching announcements',
      error: error.message
    });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !title.trim() || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      createdBy: req.user.id,
      createdByRole: req.user.role
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name role');

    return res.status(201).json({
      success: true,
      message: 'Announcement posted successfully',
      announcement: populatedAnnouncement
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating announcement',
      error: error.message
    });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwnerFaculty = req.user.role === 'faculty' && announcement.createdBy.toString() === req.user.id;

    if (!isAdmin && !isOwnerFaculty) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this announcement'
      });
    }

    await Announcement.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting announcement',
      error: error.message
    });
  }
};

export default { getAnnouncements, createAnnouncement, deleteAnnouncement };
