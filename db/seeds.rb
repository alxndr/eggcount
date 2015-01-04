[
  { date: Date.new(2014, 10, 10), count: 0 },
].each do |new_day_attributes|
  Day.create new_day_attributes
end
