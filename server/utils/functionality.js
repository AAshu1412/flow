const god_node = require("../nodes/god_node.json");


const service_mapping = async (service, operation) => {
    if(service === "god_node"){
        if(operation === "generic_http"){
            return god_node.generic_http;
        }
    }
    else{
        return null;
    }
}


const api_execution = async (service, operation,api_defination) => {
 
    if (service === "god_node" && operation === "generic_http"){
       
    const inputs = api_defination.execution.inputs;
    

    for (input_req in inputs.requestSetup){
        if(input_req.key === "method"){
            const method = input_req.value;
        }
        if(input_req.key === "url"){
            const endpoint = input_req.value;
        }
    }
    
     const tokenResponse = await fetch(
      endpoint,
      {
        method: method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );
    }
  
    
}


module.exports = { service_mapping };