json.year year[:year]
json.days year[:days] do |day|
  json.cache! day do
    json.partial! "api/days/day", day: day
  end
end
