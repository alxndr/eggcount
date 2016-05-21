require 'test_helper'

class DayTest < ActiveSupport::TestCase

  test 'requires fields' do
    day = Day.new

    assert_not day.save, 'Saved day record without fields'
  end

  test 'requires date field' do
    day = Day.new
    day.count = 3

    assert_not day.save, 'Saved day record without date'
  end

  test 'requires count field' do
    day = Day.new
    day.date = Date.new
    day.save

    assert_not day.save, 'Saved day record without count'
  end

  test 'will not allow multiple records with same field' do
    Day.create date: Date.new(2015, 7, 16), count: 2
    duplicate_day = Day.new date: Date.new(2015, 7, 16), count: 3

    assert_not duplicate_day.save, 'Saved day record with non-unique date'
  end

end
