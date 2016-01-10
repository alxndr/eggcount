json.years @years do |year|
  json.cache! year do
    json.partial! "api/years/year", year: year
  end
end
