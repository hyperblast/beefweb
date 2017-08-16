#include "player_api.hpp"

namespace msrv {

bool ValueParser<PlaylistRef>::tryParse(StringSegment segment, PlaylistRef* outVal)
{
    if (!segment)
        return false;

    int32_t index;

    if (tryParseValue(segment, &index))
    {
        if (index >= 0)
        {
            *outVal = PlaylistRef(index);
            return true;
        }
        else
        {
            return false;
        }
    }
    else
    {
        *outVal = PlaylistRef(segment.toString());
        return true;
    }
}

PlayerOption::PlayerOption(std::string name)
    : name_(std::move(name))
{
}

PlayerOption::~PlayerOption()
{
}

void PlayerOption::defineValue(std::string strValue, int32_t intValue)
{
    strValues_.reserve(strValues_.size() + 1);
    intValues_.reserve(intValues_.size() + 1);

    strValues_.emplace_back(std::move(strValue));
    intValues_.push_back(intValue);
}

const std::string& PlayerOption::get()
{
    int32_t intValue = doGet();

    for (size_t i = 0; i < intValues_.size(); i++)
    {
        if (intValues_[i] == intValue)
            return strValues_[i];
    }

    throw std::runtime_error("Unknown option value: " + toString(intValue));
}

void PlayerOption::set(const std::string& value)
{
    for (size_t i = 0; i < strValues_.size(); i++)
    {
        if (strValues_[i] == value)
            doSet(intValues_[i]);
    }

    throw InvalidRequestException("Unknown option value: " + value);
}

Player::Player()
{
}

Player::~Player()
{
}

PlayerOption* Player::getOption(const std::string& name)
{
    for (auto option : options_)
    {
        if (option->name() == name)
            return option;
    }

    throw InvalidRequestException("Unknown option: " + name);
}

OptionValueMap Player::optionValues()
{
    OptionValueMap values;

    for (auto option : options_)
        values.emplace(option->name(), option->get());

    return values;
}

}
