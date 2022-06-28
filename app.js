const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//API 1
//Return all list of states from states table

const convertDBToObjectAPI1 = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;`;
  const getStatesQueryResponse = await db.all(getStatesQuery);
  response.send(
    getStatesQueryResponse.map((item) => convertDBToObjectAPI1(item))
  );
});

//API 2
//Return state based on stateId from states table
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state WHERE state_id="${stateId}";`;
  const getStateQueryResponse = await db.get(getStateQuery);
  response.send(convertDBToObjectAPI1(getStateQueryResponse));
});

//API 3
//post a state into database
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES ("${districtName}", "${stateId}","${cases}","${cured}","${active}","${deaths}");`;
  const postDistrictQueryResponse = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//API 4
//Return list of districts based on districtID
const convertDbObjectAPI4 = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district WHERE district_id="${districtId}";`;
  const getDistrictQueryResponse = await db.get(getDistrictQuery);
  response.send(convertDbObjectAPI4(getDistrictQueryResponse));
});

//API 5
//Deletes a district from the district table based on the districtId
app.delete("/districts/:districtId/", (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id="${districtId}";`;
  const deleteDistrictQueryResponse = db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6
//Updates the details of a specific district based on districtId
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictsQuery = `
    UPDATE district 
    SET district_name="${districtName}",
        state_id="${stateId}",
        cases="${cases}",
        cured="${cured}",
        active="${active}",
        deaths="${deaths}"
    WHERE district_id=${districtId};`;
  const updateDistrictsQueryResponse = await db.run(updateDistrictsQuery);
  response.send("District Details Updated");
});

//API 7
//Returns the statistics of total cases, cured,active,deaths of a specific state based on stated  }
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statisticsSatesQuery = `
    SELECT sum(cases) AS totalCases,
           sum(cured) AS totalCured,
           sum(active) AS totalActive,
           sum(deaths) AS totalDeaths
    FROM district
    WHERE state_id=${stateId};`;
  const statisticsSatesQueryResponse = await db.get(statisticsSatesQuery);
  response.send(statisticsSatesQueryResponse);
});

//API 8
//Returns an object containing the state name of a district based on the districtID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateNameQuery = `
    SELECT state.state_name AS stateName
    FROM state INNER JOIN district ON state.state_id=district.state_id
    WHERE district.district_id="${districtId}";`;
  const stateNameQueryResponse = await db.get(stateNameQuery);
  response.send(stateNameQueryResponse);
});

module.exports = app;
