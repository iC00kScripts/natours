class APIFeatures {

  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //const queryObject = { ...req.query }; //copy the request queries into a new variable
    //const excludedFields = ['page', 'sort', 'limit', 'fields'];
    //Filtering
    // eslint-disable-next-line no-unused-vars
    const { page, sort, limit, fields, ...queryObject } = this.queryString; //OR excludedFields.forEach(el => delete
    // queryObject[el] will  exclude these fields from
    // the copy of the request queries and save others
    // into a new variable queryObject
    //Advanced filtering, implementing gte, lt, lte and others as presented within the query params
    let queryStr = JSON.stringify((queryObject));
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    //const tours = await Tour.find(queryObject); retrieve all tours from the database or filter by query params sent
    // with the request

    this.query = this.query.find(JSON.parse(queryStr)); //start chaining the queries
    //let query = Tour.find(JSON.parse(queryString)); //start chaining the queries

    return this; //return the query object for chaining purposes.
  }

  sort() {

    //SORTING THE RESULT
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' '); //allows us to sort by multiple fields e.g sort('price ratingsAverage')
      this.query.sort(sortBy); //sorts by the given column in ascending order. adding '-' to the sort params ensures that results are sorted in descending order
    } else {
      //adding a default sort to the query to sort by latest items
      this.query = this.query.sort('-_id'); //in production, we will sort by -createdAt to show latest items first
    }

    return this;
  }

  limitFields() {
    //FIELD LIMITING -  this helps to exclude unneeded fields from the response and reduce bandwidth usage
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields); //this action is referred to as projecting
    } else {
      this.query = this.query.select('-__v'); //by default, exclude the __v field from the response
    }
    return this;
  }

  paginate() {
    //PAGINATION
    const pageNum = this.queryString.page * 1 || 1; //get the page number from query or use the default
    const limitNum = this.queryString.limit * 1 || 100; //default page limit is 100 if absent in query
    const skipDocs = (pageNum - 1) * limitNum; // algorithm to calculate the number of documents to skip before returning the result

    this.query = this.query.skip(skipDocs).limit(limitNum);

    return this;
  }
}

module.exports = APIFeatures;
