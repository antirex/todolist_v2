const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const app = express();
const _ = require('lodash');
const mongoose = require("mongoose");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); //tells our app to use ejs as our view-engine ...necessary to be under const app;
app.use(express.static("css"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({ name: "Buy Food" });
const item2 = new Item({ name: "Cook Food" });
const item3 = new Item({ name: "Eat Food" });

const defaultItems = [item1, item2, item3];
const newSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("list", newSchema);

app.get("/", function (req, res) {
  Item.find(function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added the default items to DB!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newItem: foundItems });
    }
  });
});

app.get("/:newRoute", function (req, res) {
  const newRoute = _.capitalize( req.params.newRoute);
  
  List.findOne({ name: newRoute }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // console.log("doesnt exist");
        // here we create a new list for the new route mentioned
        const list = new List({
          name: newRoute,
          items: defaultItems,
        });
        list.save();
        res.redirect("/"+newRoute);
      } 
      else {
        // console.log("exist");
        // here we show the existing list 
        res.render("list", { listTitle: newRoute, newItem: foundList.items });
      }
    }
  });
 
});

app.post("/", function (req, res) {
  const itemName = req.body.addItem;
  const listTitle = req.body.list;
  let addedItem = new Item({ name: itemName });

  if(listTitle === "Today"){
    addedItem.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listTitle},function(err,foundList){
      foundList.items.push(addedItem);
      foundList.save();
      res.redirect("/"+listTitle);
    })
  }
  
});

app.post("/delete", function (req, res) {
  const checkedItem = String(req.body.checkbox);
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItem, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("success");
      res.redirect("/");
    }
  });
  }
  else{
    List.findOneAndUpdate({name: listName},{$pull:{items:{ _id: checkedItem}}},function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    })
  }
  
});

app.listen(process.env.PORT || 3000, function () {
  console.log("your server is live at");
});
