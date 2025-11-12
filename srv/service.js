const cds = require("@sap/cds");

module.exports = cds.service.impl(async function () {
  const { Books } = this.entities;

  // CREATE Hook
  this.before("CREATE", "Books", (req) => {
    if (!req.data.title || !req.data.author) {
      return req.reject(400, "Title and Author are required!");
    }
  });

  
});
