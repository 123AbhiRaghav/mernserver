const express = require("express")
const router = new express.Router()
const controller = require("../Controllers/userController.js")
const upload = require("../multerConfig/config.js")

router.post("/user/register",upload.single("user_profile"), controller.userPost)
router.get("/user/details", controller.userGet)
router.get("/user/:id", controller.getSingleUser )
router.put("/user/edit/:id", upload.single("user_profile"), controller.userEdit)
router.delete("/user/delete/:id", controller.userDelete)
router.put("/user/status/:id", controller.userStatus)
router.get("/userExport", controller.userExport)


module.exports = router