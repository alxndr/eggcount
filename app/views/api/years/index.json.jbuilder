json.years @years do |year|
  json.year year[:year]
  json.days year[:days] do |day|
    json.date day.date
    json.count day.count
    json.avg7 day.calculate_moving_average_days(7)
    #json.avg14 day.calculate_moving_average_days(14)
    json.avg28 day.calculate_moving_average_days(28)
    json.avg84 day.calculate_moving_average_days(84)
  end
end
