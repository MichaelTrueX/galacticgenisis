use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize)]
pub struct OrderEnvelope {
    pub kind: String,
    pub payload: serde_json::Value,
}

#[derive(Serialize, Deserialize)]
pub struct Delta {
    pub applied: bool,
    pub notes: String,
}

#[wasm_bindgen]
pub fn apply(order_json: &str) -> String {
    let env: Result<OrderEnvelope, _> = serde_json::from_str(order_json);
    match env {
        Ok(env) => {
            if env.kind == "move" { 
                serde_json::to_string(&Delta{ applied: true, notes: "moved one step".into() }).unwrap()
            } else {
                serde_json::to_string(&Delta{ applied: false, notes: "unsupported kind".into() }).unwrap()
            }
        }
        Err(_) => serde_json::to_string(&Delta{ applied: false, notes: "invalid envelope".into() }).unwrap()
    }
}

