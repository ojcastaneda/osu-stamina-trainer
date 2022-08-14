use serde::Deserialize;

#[derive(Deserialize)]
pub struct Order {
    pub operator: OrderOperator,
    pub property: OrderProperty,
}

impl Order {
    pub fn parse(order: Order) -> String {
        let property = match order.property {
            OrderProperty::Bpm => "bpm",
            OrderProperty::DifficultyRating => "difficulty_rating",
            OrderProperty::FavoriteCount => "favorite_count",
            OrderProperty::LastUpdated => "last_updated",
            OrderProperty::Length => "length",
            OrderProperty::LongestStream => "longest_stream",
            OrderProperty::Performance100 => "performance_100",
            OrderProperty::PlayCount => "play_count",
            OrderProperty::StreamsDensity => "streams_density",
            OrderProperty::StreamsLength => "streams_length",
            OrderProperty::StreamsSpacing => "streams_spacing",
        };
        let operator = match order.operator {
            OrderOperator::Ascending => "ASC NULLS FIRST",
            OrderOperator::Descending => "DESC NULLS LAST",
        };
        format!("ORDER BY {property} {operator}, title DESC")
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OrderOperator {
    Ascending,
    Descending,
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OrderProperty {
    Bpm,
    DifficultyRating,
    FavoriteCount,
    LastUpdated,
    Length,
    LongestStream,
    #[serde(rename = "performance_100")]
    Performance100,
    PlayCount,
    StreamsDensity,
    StreamsLength,
    StreamsSpacing,
}
