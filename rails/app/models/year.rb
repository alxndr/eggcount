class Year

  def self.find_stuff
    all_days = Day.all.order(:date)
    days_by_year = all_days.chunk { |day| day.date.year }
    days_by_year.map do |year, days_in_year|
      {
        year: year,
        days: days_in_year
      }
    end
  end

end
