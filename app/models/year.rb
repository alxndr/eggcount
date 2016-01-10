class Year

  def self.find_stuff
    days_by_year = Day.order(:date).chunk { |day| day.date.year }
    days_by_year.map do |year, days_in_year|
      {
        year: year,
        days: days_in_year,
      }
    end
  end

end
