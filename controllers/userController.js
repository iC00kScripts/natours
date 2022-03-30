const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const fs = require('fs');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    return cb(null, true);
  }
  cb(new AppError('Only image uploads allowed', 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

//this function helps to delete previous user photo on update.
const deletePhotoFromServer = async (photo) => {
  if (photo.startsWith('default')) return;

  const path = `public/img/users/${photo}`;
  await fs.unlink(path, (err) => {
    //if (err) return console.log(err);
  });
};

//this function helps to filter our all elements not listed in allowedFields from the object
const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id; //faking the user id as coming from the params in order to use the getUser function
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Use /UpdatePassword',
        400
      )
    );
  }
  //update user document
  let filteredBody = filterObject(req.body, 'name', 'email'); //filter our field names that aren't allowed to be updated
  if (req.file) {
    filteredBody.photo = req.file.filename; //add uploaded image if available
    await deletePhotoFromServer(req.user.photo); //remove the old file from the system
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, //return the newly updated document
    runValidators: true, //run validators on update
  });

  res.status(200).json({
    status: 'success',
    message: 'Updated user successfully',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined Please use /signup instead',
  });
};

exports.getUser = factory.getOne(User);

//for Administrative purposes only
exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
