class Day < ActiveRecord::Base

  validates :count, presence: true
  validates :date, presence: true # should also be unique

  def self.to_json_object
    year_range = (minimum(:date).year..maximum(:date).year)
    year_range.each_with_object({}) do |year, json_object|
      json_object[year] = days_within_year(year).map do |day|
        {
          date: day.date,
          count: day.count,
        }
      end
    end.to_json
  end

  def self.days_within_year(year)
    where(date: Date.new(year, 1, 1)..Date.new(year, 12, 31)).order(:date)
  end

end
