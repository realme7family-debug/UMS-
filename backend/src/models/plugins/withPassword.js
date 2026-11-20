const bcrypt = require("bcryptjs");

// shared by Admin, Faculty and Student schemas
module.exports = function withPassword(schema) {
  schema.add({
    password: { type: String, required: true, minlength: [6, "Password must be at least 6 characters"], select: false },
  });

  schema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
  });

  schema.methods.matchPassword = function (plain) {
    return bcrypt.compare(plain, this.password);
  };

  // never send the hash back in API responses
  schema.set("toJSON", {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  });
};
