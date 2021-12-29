use rosu_pp::parse::HitObject;

#[derive(Debug)]
pub struct HitObjectInterval {
    pub time: (u32, u32),
    pub bpm: u32,
    pub distance: f32,
}

impl HitObjectInterval {
    pub fn new(first_hit_object: &HitObject, second_hit_object: &HitObject) -> Self {
        Self {
            time: (
                first_hit_object.start_time as u32,
                second_hit_object.start_time as u32,
            ),
            bpm: (60000.0
                / (second_hit_object.start_time - first_hit_object.start_time))
            .round() as u32,
            distance: ((first_hit_object.pos.x - second_hit_object.pos.x).powi(2)
                + (first_hit_object.pos.y - second_hit_object.pos.y).powi(2))
            .sqrt(),
        }
    }
}
