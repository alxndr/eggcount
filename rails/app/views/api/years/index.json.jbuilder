json.years @years do |year|
  json.partial! "api/years/year", year: year
end
