require 'test_helper'

class DayTest < ActiveSupport::TestCase

  test 'requires fields' do
    day = Day.new

    assert_not day.save, 'Saved day record without fields'
    puts "\nrequires fields created #{day.date}:#{day.count}"
  end

  test 'requires date field' do
    day = Day.new
    day.count = 3

    assert_not day.save, 'Saved day record without date'
    puts "\nrequires date field created #{day.date}:#{day.count}"
  end

  test 'requires count field' do
    day = Day.new
    day.date = Date.new

    assert_not day.save, 'Saved day record without count'
    puts "\nrequires count field created #{day.date}:#{day.count}"
  end

  test 'default sort order' do
    day1 = Day.new
    day1.date = Date.new 2014, 7, 1
    day1.count = 1
    day1.save!

    day2 = Day.new
    day2.date = Date.new 2014, 6, 1
    day2.count = 2
    day2.save!

    day3 = Day.new
    day3.date = Date.new 2014, 7, 2
    day3.count = 3
    day3.save!

    days = Day.all
    puts "\nall days:"
    puts days.inspect

    assert_equal days.length, 3
    assert_equal days[0], day2
    assert_equal days[1], day1
    assert_equal days[2], day3
  end

end
