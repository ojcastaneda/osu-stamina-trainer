use super::beatmap::RankedStatus;
use serde::Deserialize;
use sqlx::types::chrono::{DateTime, Utc};

#[derive(Deserialize)]
pub struct Filter {
    pub operator: Operator,
    pub property: Property,
    pub value: Value,
}

impl Filter {
    pub fn parse_multiple(filters: &[Filter], include_title: bool) -> String {
        let mut parsed_filters = Vec::<String>::new();
        for (index, filter) in filters.iter().enumerate() {
            parsed_filters.push(Self::parse(filter, index + 1));
        }
        if include_title {
            parsed_filters.push(format!(
                "title ILIKE CONCAT('%', ${}, '%')",
                filters.len() + 1
            ))
        }
        if !parsed_filters.is_empty() {
            format!("WHERE {}", parsed_filters.join(" AND "))
        } else {
            String::with_capacity(0)
        }
    }

    fn parse(filter: &Filter, index: usize) -> String {
        let property = match filter.property {
            Property::Accuracy => "accuracy",
            Property::ApproachRate => "approach_rate",
            Property::CircleSize => "circle_size",
            Property::DifficultyRating => "difficulty_rating",
            Property::Bpm => "bpm",
            Property::FavoriteCount => "favorite_count",
            Property::LastUpdated => "last_updated",
            Property::Length => "length",
            Property::LongestStream => "longest_stream",
            Property::Performance100 => "performance_100",
            Property::Performance95 => "performance_95",
            Property::PlayCount => "play_count",
            Property::RankedStatus => "ranked_status",
            Property::StreamsDensity => "streams_density",
            Property::StreamsLength => "streams_length",
            Property::StreamsSpacing => "streams_spacing",
        };
        let operator = match filter.operator {
            Operator::Exact => "=",
            Operator::Maximum => "<=",
            Operator::Minimum => ">=",
        };
        format!("{property} {operator} ${index}")
    }
}

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Operator {
    Exact,
    Maximum,
    Minimum,
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Property {
    Accuracy,
    ApproachRate,
    Bpm,
    CircleSize,
    DifficultyRating,
    FavoriteCount,
    LastUpdated,
    Length,
    LongestStream,
    #[serde(rename = "performance_100")]
    Performance100,
    #[serde(rename = "performance_95")]
    Performance95,
    PlayCount,
    RankedStatus,
    StreamsDensity,
    StreamsLength,
    StreamsSpacing,
}

#[derive(Deserialize, Debug)]
#[serde(untagged)]
pub enum Value {
    Date(DateTime<Utc>),
    Integer(i16),
    Decimal(f32),
    RankedStatus(RankedStatus),
}
