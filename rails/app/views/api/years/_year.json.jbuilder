json.year year[:year]
json.days year[:days] do |day|
  json.partial! "api/days/day", day: day
end
