class APIFeatures {
    constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
    }
  
    filter() {
      const quaryObj = { ...this.queryString };
      const excludedField = ["page", "sort", "limit", "fields"];
      excludedField.forEach((el) => delete quaryObj[el]);
      let queryStr = JSON.stringify(quaryObj);
      queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
      this.query = this.query.find(JSON.parse(queryStr));
      return this;
    }
  
    sort() {
      if (this.queryString.sort) {
        let sortBy = this.queryString.sort.split(",").join(" ");
        this.query = this.query.sort(sortBy);
      } else {
        this.query = this.query.sort("-createdAt");
      }
      return this;
    }
    limitFields() {
      if (this.queryString.fields) {
        let fields = this.queryString.fields.split(",").join(" ");
        this.query = this.query.select(fields);
      } else {
        this.query = this.query.select("-__v");
      }
      return this;
    }
  
    pagination() {
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 50;
      const skip = (page - 1) * limit;
      this.query = this.query.skip(skip).limit(limit);
  
      // if (this.queryString.page) {
      //   const documents = await Product.countDocuments();
      //   if (skip > documents) throw new Error("this page does not exist");
      // }
      return this;
    }
  }

  module.exports=APIFeatures