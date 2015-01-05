[
  { date: Date.new(2014,  1, 20), count: 5 },
  { date: Date.new(2014,  1, 22), count: 3 },
  { date: Date.new(2014,  1, 23), count: 2 },
  { date: Date.new(2014,  1, 26), count: 5 },
  { date: Date.new(2014,  1, 27), count: 1 },
  { date: Date.new(2014,  1, 28), count: 1 },
  { date: Date.new(2014,  1, 29), count: 3 },
  { date: Date.new(2014,  1, 30), count: 4 },
  { date: Date.new(2014,  1, 31), count: 1 },
  { date: Date.new(2014,  2,  1), count: 4 },
  { date: Date.new(2014,  2,  2), count: 3 },
  { date: Date.new(2014,  2,  3), count: 1 },
  { date: Date.new(2014,  2,  4), count: 3 },
  { date: Date.new(2014,  2,  5), count: 3 },
  { date: Date.new(2014,  2,  7), count: 5 },
  { date: Date.new(2014,  2,  8), count: 8 },
].each do |new_day_attributes|
  Day.create new_day_attributes
end
