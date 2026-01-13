const Tutorial = require("../models/Tutorial");

// @desc    Get all tutorials
// @route   GET /api/tutorials
// @access  Private
exports.getTutorials = async (req, res) => {
  try {
    const { category } = req.query;

    let query = {};
    if (category) {
      query.category = category;
    }

    const tutorials = await Tutorial.find(query)
      .populate("createdBy", "name photo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tutorials.length,
      tutorials,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single tutorial
// @route   GET /api/tutorials/:id
// @access  Private
exports.getTutorial = async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id).populate(
      "createdBy",
      "name photo email"
    );

    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: "Tutorial not found",
      });
    }

    res.status(200).json({
      success: true,
      tutorial,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create tutorial
// @route   POST /api/tutorials
// @access  Private/Admin
exports.createTutorial = async (req, res) => {
  try {
    const { title, description, youtubeUrl, category } = req.body;

    const tutorial = await Tutorial.create({
      title,
      description,
      youtubeUrl,
      category,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Tutorial created successfully",
      tutorial,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update tutorial
// @route   PUT /api/tutorials/:id
// @access  Private/Admin
exports.updateTutorial = async (req, res) => {
  try {
    let tutorial = await Tutorial.findById(req.params.id);

    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: "Tutorial not found",
      });
    }

    tutorial = await Tutorial.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Tutorial updated successfully",
      tutorial,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete tutorial
// @route   DELETE /api/tutorials/:id
// @access  Private/Admin
exports.deleteTutorial = async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);

    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: "Tutorial not found",
      });
    }

    await tutorial.deleteOne();

    res.status(200).json({
      success: true,
      message: "Tutorial deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
