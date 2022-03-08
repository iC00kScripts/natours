const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

function getModelName(Model) {
  return Model.collection.collectionName.slice(0, -1);
}

//creating a factory function that handles all document delete operations to reduce repetitive codes
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        [getModelName(Model)]: doc, //retrieve the name of the model
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //one way to save document in mongoose
    // const newTour = new Tour({});
    // newTour.save();

    //another preferred way
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        [getModelName(Model)]: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions); //include virtual populate if present

    const doc = await query; //find the tour using the id passed into the request parameter. Populate all associated reviews using virtual populate
    //similarly we can use Tour.findOne({_id:req.params.id}) and it will work just the same way.

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        [getModelName(Model)]: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //to allow for nested GET reviews on tour (HACK)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId }; //if tourId is present in req params, return the reviews for just that tour.

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate(0); //run all features on the query

    const docs = await features.query; //execute the chained queries on the database model

    //send response
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        [getModelName(Model)]: docs,
      },
    });
  });
