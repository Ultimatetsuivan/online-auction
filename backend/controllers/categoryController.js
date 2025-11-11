const asyncHandler = require("express-async-handler");
const Category = require("../models/category");

const createCategory = asyncHandler(async (req, res) => {
    try {
        const { title, titleMn, description, icon, image, parent, order } = req.body;

        const existingCategory = await Category.findOne({title: title});
        if(existingCategory) {
          return res.status(400).json({message : "Энэ категори нь аль хэдийн үүссэн байна"});
        }

        const category = await Category.create({
            user: req.user?._id,
            title,
            titleMn,
            description,
            icon: icon || "cube-outline",
            image,
            parent,
            order: order || 0,
        });

        res.status(201).json(category);
    } catch (error){
        console.error("Create category error:", error);
        res.status(500).json({message: "Алдаа", error: error.message})
    }
});

const getAllCategories = asyncHandler(async (req, res) => {
    try{
        const categories = await Category.find({ isActive: true })
            .populate("parent")
            .sort("order")
            .select("-__v");

        res.json(categories);
    }catch(error){
        console.error("Get categories error:", error);
        res.status(500).json({ message: "Категори унших алдаа", error: error.message });
    }
});

const getCategory = asyncHandler(async (req, res) => {
    const {id} = req.params;

    try{
        const category = await Category.findById(id).populate("user").sort("-createdAt");
        res.json(category);
    }catch(error){
        res.json(error);

    }
});



const deleteCategory = asyncHandler(async (req, res) => {
    const {id} = req.params;

    try{
        await Category.findByIdAndDelete(id);
        res.status(200).json({message:"амжилттай устгагдлаа"});
    }catch(error){
        res.json(error);

    }
});
module.exports = {
    createCategory,
    getAllCategories,
    getCategory,
    deleteCategory
}