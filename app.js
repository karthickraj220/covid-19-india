const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbpath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());
let db = null;
const initializedbandserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};
initializedbandserver();

const convertstatetoresponse = (dbobject) => {
  return {
    stateId: dbobject.state_id,
    stateName: dbobject.state_name,
    population: dbobject.population,
  };
};

const convertdistricttoresponse = (dbobject) => {
  return {
    districtId: dbobject.district_id,
    districtName: dbobject.district_name,
    stateId: dbobject.state_id,
    cases: dbobject.cases,
    cured: dbobject.cured,
    active: dbobject.active,
    deaths: dbobject.deaths,
  };
};

const convertstatedetailstoresponse = (dbobject) => {
  return {
    totalCases: dbobject.cases,
    totalCured: dbobject.cured,
    totalActive: dbobject.active,
    totalDeaths: dbobject.deaths,
  };
};

const convertstatetostatename = (dbobject) => {
  return {
    stateName: dbobject.state_name,
  };
};

app.get("/states/", async (request, response) => {
  const statequery = `SELECT * FROM state`;
  const state = await db.all(statequery);
  response.send(state.map((each) => convertstatetoresponse(each)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const statequery = `SELECT * FROM state WHERE state_id = ${stateId}`;
  const state = await db.get(statequery);
  const states = convertstatetoresponse(state);
  response.send(states);
});

app.post("/districts/", async (request, response) => {
  const requestob = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = requestob;
  const districtquery = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths) VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths})`;
  const adddistrict = await db.run(districtquery);
  response.send("District Successfully");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getquery = `SELECT * FROM district WHERE district_id = ${districtId}`;
  const district = await db.get(getquery);
  response.send(convertdistricttoresponse(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletequery = `DELETE FROM district WHERE district_id = ${districtId}`;
  await db.run(deletequery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtdetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtdetails;
  const updatequery = `UPDATE district
    SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE 
    district_id = ${districtId};`;
  await db.run(updatequery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statequery = `SELECT * FROM district WHERE state_id = ${stateId}`;
  const state = await db.get(statequery);
  response.send(convertstatedetailstoresponse(state));
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getstateid = `SELECT * FROM district WHERE district_id = ${districtId}`;
  const getstate = await db.get(getstateid);
  const stateId = getstate.state_id;
  const statequery = `SELECT * FROM state WHERE state_id = ${stateId}`;
  const state = await db.get(statequery);
  response.send(convertstatetostatename(state));
});

module.exports = app;
