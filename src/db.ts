import mongoose from "mongoose";
const connect = async () => {
  try {
    const connectiion = await mongoose.connect(
      process.env.MONOGODB_CONNECTION_STRING!
    );
    console.log(connectiion.connection.host);
  } catch (err) {
    console.log(err);
  }
};

export default connect;
