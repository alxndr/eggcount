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

end
