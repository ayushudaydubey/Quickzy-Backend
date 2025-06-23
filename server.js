import app from "./src/app.js";
import { connectDB } from "./src/db/db.js";




app.listen(3000,()=>{
    connectDB()
  console.log("server is running");

})
