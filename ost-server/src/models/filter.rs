use super::beatmap::RankedStatus;
use crate::{error::Error, ServerResult};
use serde::Deserialize;
use sqlx::{
    postgres::PgArguments,
    query::QueryAs,
    types::chrono::{DateTime, Utc},
    Postgres,
};

#[derive(Deserialize)]
pub struct Filter {
    pub operator: Operator,
    pub property: Property,
    value: Value,
}

impl Filter {
    pub fn bind<'q, T>(
        &self,
        query: QueryAs<'q, Postgres, T, PgArguments>,
    ) -> ServerResult<QueryAs<'q, Postgres, T, PgArguments>> {
        Ok(match &self.value {
            Value::Date(date) => {
                if !matches!(self.property, Property::LastUpdated) {
                    return Err(Error::DynamicFilter(self.property));
                } else {
                    query.bind(*date)
                }
            }
            Value::Integer(integer) => match self.property {
                Property::Accuracy
                | Property::ApproachRate
                | Property::CircleSize
                | Property::DifficultyRating
                | Property::StreamsDensity
                | Property::StreamsSpacing => query.bind(*integer as f32),
                Property::RankedStatus | Property::LastUpdated | Property::Id => {
                    return Err(Error::DynamicFilter(self.property))
                }
                _ => query.bind(*integer),
            },
            Value::Decimal(decimal) => match self.property {
                Property::Accuracy
                | Property::ApproachRate
                | Property::CircleSize
                | Property::DifficultyRating
                | Property::StreamsDensity
                | Property::StreamsSpacing => query.bind(*decimal),
                Property::RankedStatus | Property::LastUpdated | Property::Id => {
                    return Err(Error::DynamicFilter(self.property))
                }
                _ => query.bind(decimal.round() as i16),
            },
            Value::RankedStatus(ranked_status) => {
                if !matches!(self.property, Property::RankedStatus) {
                    return Err(Error::DynamicFilter(self.property));
                } else {
                    query.bind(*ranked_status)
                }
            }
            Value::SkippedIds(ids) => {
                if !matches!(self.property, Property::Id) {
                    return Err(Error::DynamicFilter(self.property));
                } else {
                    query.bind(ids.clone())
                }
            }
        })
    }

    pub fn parse_multiple(filters: &[Filter], include_title: bool) -> String {
        let mut parsed_filters = Vec::<String>::new();
        for (index, filter) in filters.iter().enumerate() {
            parsed_filters.push(filter.parse(index + 1));
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
            String::new()
        }
    }

    fn parse(&self, index: usize) -> String {
        let property = match self.property {
            Property::Accuracy => "accuracy",
            Property::ApproachRate => "approach_rate",
            Property::CircleSize => "circle_size",
            Property::DifficultyRating => "difficulty_rating",
            Property::Bpm => "bpm",
            Property::FavoriteCount => "favorite_count",
            Property::Id => "id",
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
        let operator = match self.operator {
            Operator::Different => "!=",
            Operator::Exact => "=",
            Operator::Maximum => "<=",
            Operator::Minimum => ">=",
        };
        if matches!(self.value, Value::SkippedIds(_)) {
            format!("{property} {operator} ALL(${index})")
        } else {
            format!("{property} {operator} ${index}")
        }
    }
}

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Operator {
    Different,
    Exact,
    Maximum,
    Minimum,
}

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Property {
    Accuracy,
    ApproachRate,
    Bpm,
    CircleSize,
    DifficultyRating,
    FavoriteCount,
    Id,
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

#[derive(Deserialize)]
#[serde(untagged)]
pub enum Value {
    Date(DateTime<Utc>),
    Integer(i16),
    Decimal(f32),
    RankedStatus(RankedStatus),
    SkippedIds(Vec<i32>),
}
