json.years @years do |year|
  json.year year[:year]
  json.days year[:days] do |day|
    json.date day.date
    json.count day.count
    json.moving_averages do
      json.day7 day.calculate_moving_average_days(7)
      json.day14 day.calculate_moving_average_days(14)
      json.day28 day.calculate_moving_average_days(28)
    end
  end
end
