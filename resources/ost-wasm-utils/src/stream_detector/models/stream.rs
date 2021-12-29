use std::collections::HashMap;

#[derive(Debug)]
pub struct Stream {
    pub last_bpm_added: u32,
    pub hit_objects: u32,
    pub bpm_changes: HashMap<u32, u32>,
    pub max_bpm_change: u32,
    previous_max_bpm_change: u32,
}

impl Stream {
    pub fn new() -> Self {
        Self {
            last_bpm_added: 0,
            hit_objects: 0,
            bpm_changes: HashMap::new(),
            max_bpm_change: 0,
            previous_max_bpm_change: 0,
        }
    }

    pub fn update_bpm_change(&mut self, bpm: u32, amount: i32) {
        let bpm_value: Option<&u32> = self.bpm_changes.get(&bpm);
        let new_amount: i32;
        if bpm_value.is_some() {
            new_amount = *bpm_value.unwrap() as i32 + amount;
        } else {
            new_amount = amount;
        }
        if new_amount.is_positive() {
            self.bpm_changes.insert(bpm, new_amount as u32);
            if self.max_bpm_change < bpm {
                if self.max_bpm_change != 0 {
                    self.previous_max_bpm_change = self.max_bpm_change
                }
                self.max_bpm_change = bpm
            }
        } else {
            self.bpm_changes.remove(&bpm);
            if self.max_bpm_change == bpm {
                self.max_bpm_change = self.previous_max_bpm_change
            }
        }
        let new_hit_objects = self.hit_objects as i32 + amount;
        if !new_hit_objects.is_negative() {
            self.hit_objects = new_hit_objects as u32
        }
    }
}
